// This might be evil and generally abuiseive of the javascript type system but...
// This here will allow us to call an arbitray method-like thing on any object
// and transform it into an rpc invocation though we don't know the endpoint name until runtime.
// If the invoked method is an endpoint on the rpc server, it will be invoked as such.
//
// so we can do something like:
// const full_node = createRpcProxy(chiaDeamon, 'chia_full_node');
// const state = await full_node.get_blocchain_state();
//
/**
 * [createRpcProxy Returns a proxy object that transforms any method into an RPC invocation]
 * @param  {Chia} chia The chia daemon service that will execute the RPC
 * @param  {string} endpoint The name of the chia endpoint service
 */
export default function createRpcProxy(chia, endpoint) {
    // create a proxy around a new empty object that will intrecept
    // any method call that doesn't exist and turn it into an RPC invocation
    return new Proxy({}, {
        get(target, functionName) {
            if (typeof target[functionName] === 'undefined') {
                // here, since 'functionName' does not exist on the object, we are
                // going to assume it is an rpc function name on endpoint
                // here we call back into the chia server to do the RPC
                return async (data) => await chia.sendCommand(endpoint, functionName, data);
            } else if (typeof target[functionName] === 'function') {
                // here the function exists so just reflect apply to invoke
                return new Proxy(target[functionName], {
                    apply: (target, thisArg, argumentsList) => Reflect.apply(target, thisArg, argumentsList)
                });
            } else {
                // here the property is a value - reflect return it
                return Reflect.get(target, functionName);
            }
        }
    });
}
