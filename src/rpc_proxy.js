// this here will allow us to call an arbitray method like thing on any object
// and transform it into an rpc method though we don't know the endpoint name until runtime
// assuing the invoked method is an endpoint on the rpc server, it will be invoked
//
// so we can do something like:
// const full_node = createRpcProxy({}, chiaServer, "chia_full_node");
// const state = await full_node.get_blocchain_state();
//
export function createRpcProxy(theTarget, chia, endpoint) {
    // create a proxy around `theTarget` that will intrecept
    // any method call that doesn't exist and turn it into an RPC invocation
    return new Proxy(theTarget, {
        get(target, functionName) {
            if (typeof target[functionName] === 'undefined') {
                // here, since 'name' does not exist on the object, we are
                // going to assume it is an rpc endpoint name on endpoint
                return async (data) => {
                    return await chia.sendCommand(endpoint, functionName, data);
                };
            } else if (typeof target[functionName] === 'function') {
                // here the function exists so just reflect apply to invoke
                return new Proxy(target[functionName], {
                    apply: (target, thisArg, argumentsList) => {
                        return Reflect.apply(target, thisArg, argumentsList);
                    }
                });
            } else {
                // here the property is a value - reflect return it
                return Reflect.get(target, functionName);
            }
        }
    });
}
