import { stringify, withDefaults } from '../../../../../utils.js'

const contents = ({ titleTemplate, extraIcons, extraMetadata }) => `
import type { Metadata } from "next";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? \`https://\${process.env.VERCEL_PROJECT_PRODUCTION_URL}\`
  : \`http://localhost:\${process.env.PORT || 3000}\`;
const titleTemplate = "${titleTemplate[0] || '%s | Scaffold-ETH 2'}";

export const getMetadata = ({
  title,
  description,
  imageRelativePath = "/thumbnail.jpg",
}: {
  title: string;
  description: string;
  imageRelativePath?: string;
}): Metadata => {
  const imageUrl = \`\${baseUrl}\${imageRelativePath}\`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: titleTemplate,
    },
    description: description,
    openGraph: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    twitter: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [imageUrl],
    },
    icons: {
      icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
      ${extraIcons[0] ? Object.entries(extraIcons[0]).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n      ') : ''}
    },
    ${extraMetadata[0] ? Object.entries(extraMetadata[0]).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n    ') : ''}
  };
};
`

export default withDefaults(contents, {
  titleTemplate: '',
  extraIcons: {},
  extraMetadata: {}
})
