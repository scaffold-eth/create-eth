import { withDefaults } from "../../../../utils.js";

const contents = ({postContent}) =>
`# dependencies
node_modules

# env files
.env

# coverage
coverage
coverage.json

# typechain
typechain
typechain-types

# hardhat files
cache
artifacts

# zkSync files
artifacts-zk
cache-zk

# deployments
deployments/localhost

# typescript
*.tsbuildinfo

# other
temp
${postContent[0] || ''}`;

export default withDefaults(contents, {
  postContent: ''
})