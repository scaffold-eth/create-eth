import { withDefaults } from '../../../utils.js'

const contents = ({ extraPaths, extraPlugins, extraCompilerOptions, extraInclude, extraExclude }) => `{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "~~/*": ["./*"]${extraPaths[0] ? `,${extraPaths[0]}` : ''}
    },
    "plugins": [
      {
        "name": "next"
      }${extraPlugins[0] ? `,${extraPlugins[0]}` : ''}
    ]${extraCompilerOptions[0] ? `,${extraCompilerOptions[0]}` : ''}
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"${extraInclude[0] ? `,${extraInclude[0]}` : ''}
  ],
  "exclude": [
    "node_modules"${extraExclude[0] ? `,${extraExclude[0]}` : ''}
  ]
}`

export default withDefaults(contents, {
  extraPaths: '',
  extraPlugins: '',
  extraCompilerOptions: '',
  extraInclude: '',
  extraExclude: ''
})
