const lintCommand = filenames => `yarn lint ${filenames.filter(file => !file.includes("/templates/")).join(" ")}`;

export default {
  "**/*.{js,jsx,ts,tsx}": [lintCommand],
};
