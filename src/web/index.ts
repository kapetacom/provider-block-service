import { BlockConfig } from "@blockware/ui-web-types";
import ServiceBlockEditorComponent from './ServiceBlockEditorComponent';
import ServiceBlockValidation from './ServiceBlockValidation';
const blockDefinition = require('../../blockware.yml');

const blockType:BlockConfig = {
    kind: blockDefinition.metadata.id,
    name: blockDefinition.metadata.name,
    validate: ServiceBlockValidation,
    componentType: ServiceBlockEditorComponent
};

export default blockType;