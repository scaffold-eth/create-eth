import { withDefaults } from '../../../../utils.js'

const contents = ({ preConfigContent }) =>
`${preConfigContent}
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

:root,
[data-theme] {
  background: oklch(var(--b2));
}

body {
  min-height: 100vh;
}

h1,
h2,
h3,
h4 {
  margin-bottom: 0.5rem;
  line-height: 1;
}

p {
  margin: 1rem 0;
}

.btn {
  @apply shadow-md;
}

.btn.btn-ghost {
  @apply shadow-none;
}
`

export default withDefaults(contents, {
  preConfigContent: ''
})
