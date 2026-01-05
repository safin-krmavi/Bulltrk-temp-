export const apiurls = {

    userAuth: { 
        login: "/crypto/user/login",
        googleLogin: "/user/googlelogin",
        signup: "/crypto/user/signup",
        verifyEmail: "/crypto/user/verify",
        me:"/crypto/user/me",
        updateprofile:"/crypto/user/update"
    },
    credentials:{
        createCredentials:"/crypto/credentials/",
        verifyCredentials:"/crypto/exchange/verify-keys",
        getConnections:"/crypto/credentials/:userId",
        updateCrendential:"/crypto/credentials/:id",

    },
    exchangemanagement:{
     getSymbolbyprecision:"/crypto/exchange/symbol-precision?exchange=&tradeType=",
     getSymbol:"/crypto/exchange/symbol-pairs",
     getbalance:"/crypto/exchange/get-balances"
    },
    strategies: {
        growthDCA: "/strategy/strategies",
        getAll: "/strategy/strategies",
        getById: "/strategy/strategies/:id",
        update: "/strategy/strategies/:id",
        delete: "/strategy/strategies/:id"
    },
    spottrades:{
        createstrategy:"/crypto/trade/create"
    },
    candlechart:{
        candlegraph:"/crypto/exchange/candles"
    }

}