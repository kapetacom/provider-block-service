
import {
    BlockTargetProvider
} from "@kapeta/ui-web-context";

import {BlockDefinition} from "@kapeta/schemas";

export default function(block:BlockDefinition) {
    const errors:string[] = [];

    if (!block.spec.target) {
        errors.push('Missing target configuration');
    } else if (!block.spec.target.kind) {
        errors.push('Missing target kind');
    }

    if (block.spec.target &&
        block.spec.target.kind) {
        const blockTarget = BlockTargetProvider.get(block.spec.target.kind, block.kind);
        if (!blockTarget) {
            errors.push('Target kind not available');
        } else if (blockTarget.validate) {
            const targetErrors = blockTarget.validate(block.spec.target.options);

            errors.push(...targetErrors);
        }
    }

    return errors;
};