import { BlockConfig } from "@blockware/ui-web-types";
import ServiceBlockEditorComponent from './ServiceBlockEditorComponent';
import ServiceBlockValidation from './ServiceBlockValidation';
const blockDefinition = require('../../blockware.yml');
const packageJson = require('../../package.json');

const blockType:BlockConfig = {
    kind: blockDefinition.metadata.name,
    version: packageJson.version,
    title: blockDefinition.metadata.title,
    validate: ServiceBlockValidation,
    componentType: ServiceBlockEditorComponent
};

export default blockType;