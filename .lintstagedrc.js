const formatCommand = filenames => `yarn format ${filenames.join(" ")}`;
const lintCommand = filenames => `yarn lint ${filenames.join(" ")}`;

export default {
  "**/*": [formatCommand],

  "**/*.{js,jsx,ts,ts}": [lintCommand],
};
