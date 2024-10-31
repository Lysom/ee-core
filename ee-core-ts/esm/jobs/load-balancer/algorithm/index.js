import Consts from "../consts.js";
export default {
    [Consts.polling]: require('./polling'),
    [Consts.weights]: require('./weights'),
    [Consts.random]: require('./random'),
    [Consts.specify]: require('./specify'),
    [Consts.minimumConnection]: require('./minimumConnection'),
    [Consts.weightsPolling]: require('./weightsPolling'),
    [Consts.weightsRandom]: require('./weightsRandom'),
    [Consts.weightsMinimumConnection]: require('./weightsMinimumConnection')
};
