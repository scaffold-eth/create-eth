import { stringify, withDefaults } from '../../../../utils.js'

const contents = ({ name, description, iconPath, extraContent }) => stringify({
  name: name[0],
  description: description[0],
  ...(iconPath[0] && { iconPath: iconPath[0] }), // Only include iconPath if it's provided
  ...extraContent[0]
})

export default withDefaults(contents, {
  name: "Scaffold-ETH 2 DApp",
  description: "A DApp built with Scaffold-ETH",
  iconPath: "logo.svg",
  extraContent: []
})