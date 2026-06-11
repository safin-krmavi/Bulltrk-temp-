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
     getbalance:"/crypto/exchange/get-balances",
     availableBalances: "/crypto/exchange/available-balances"
    },
    strategies: {
        create: "/strategy/strategies",
        getAll: "/strategy/strategies",
        getById: "/strategy/strategies/:id",
        update: "/strategy/strategies/:id",
        delete: "/strategy/strategies/:id",
        limits:"/strategy/calculate-smart-grid-limits"
    },
    spottrades:{
        createstrategy:"/crypto/trade/create"
    },
    Copytrade:{
        getallstratgies:"/strategy/strategies/published",
        subscribestrategy:"/strategy/strategies/:id/subscribe",
        getsubscribedstrategies:"/strategy/strategies/subscriptions/me",
        unsubscribestrategy:"/strategies/subscription/:id"
    },
    marketplace: {
        browsePublished: "/strategy/strategies/published",
        purchase: "/strategy/strategies/purchase",
        myPurchases: "/strategy/strategies/purchases/me",
    },
    backtest: {
        run: "/backtest/run",
        results: "/backtest/results/:runId",
        history: "/backtest/history",
        delete: "/backtest/:runId",
    },
    nlpStrategy: {
        preview: "/strategy/nlp/preview",
        create: "/strategy/nlp/create",
    },

}