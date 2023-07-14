
const init = async (args) => {

  module.exports.env = args.env
  module.exports.configs = args.configs
  module.exports.data = args.data

}
module.exports.init = init