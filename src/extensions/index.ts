import { createEthExtensions } from "./create-eth-extensions";
import { challenges } from "./challenges";
import { organizations } from "./organizations";
import type { Extension } from "./types";

const extensions: Extension[] = [...createEthExtensions, ...challenges, ...organizations];

export default extensions;
export { createEthExtensions, challenges, organizations };
export type { Extension };
