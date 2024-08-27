const formatCommand = filenames => `yarn format ${filenames.join(" ")}`;
const lintCommand = filenames => `yarn lint ${filenames.filter(file => !file.includes("/templates/")).join(" ")}`;

export default {
  "**/*": [formatCommand],

  "**/*.{js,jsx,ts,tsx}": [lintCommand],
};
