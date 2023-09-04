import { makePayload, getPayloadDescriptor } from "./payload_generator.js";
// This might be evil and generally abusive of the javascript type system but...
// This here will allow us to call an arbitrary method-like thing on any object
// and transform it into an rpc invocation though we don't know the endpoint name until runtime.
// If the invoked method is an endpoint on the rpc server, it will be invoked as such.
//
// so we can do something like the below even though get_blockchain_state is not declared or implemented anywhere:
// const full_node = createRpcProxy(chiaDaemon, 'chia_full_node');
// const state = await full_node.get_blockchain_state();
//
/**
 * Returns a proxy object that transforms any method into an RPC invocation.
 * @param {ChiaDaemon | ChiaHttps} chia - The chia endpoint service that will execute the RPC.
 * @param {string} service - The name of the chia endpoint service.
 * @returns {Proxy} The proxy that will route methods calls.
 */
export default function createRpcProxy(chia, service) {
    // create a proxy around a new object that will intercept
    // any method call that doesn't exist and turn it into an RPC invocation
    //
    // add a couple helper functions to our synthetic object
    const o = {
        makePayload: (endpoint, requiredOnly = true) =>
            makePayload(service, endpoint, requiredOnly),
        getPayloadDescriptor: (endpoint) =>
            getPayloadDescriptor(service, endpoint),
    };

    return new Proxy(o, {
        get(target, functionName) {
            if (typeof target[functionName] === "undefined") {
                // here, since 'functionName' does not exist on the object, we are
                // going to assume it is an rpc function name on the endpoint
                // here we call back into the chia server to do the RPC
                return async (data) =>
                    await chia.sendCommand(service, functionName, data);
            } else if (typeof target[functionName] === "function") {
                // here the function exists so just reflect apply to invoke
                return new Proxy(target[functionName], {
                    apply: (target, thisArg, argumentsList) =>
                        Reflect.apply(target, thisArg, argumentsList),
                });
            } else {
                // here the property is a value - reflect return it
                return Reflect.get(target, functionName);
            }
        },
    });
}
