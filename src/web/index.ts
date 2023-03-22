import { BlockConfig } from "@kapeta/ui-web-types";
import {ServiceBlockEditorComponent} from './ServiceBlockEditorComponent';
import ServiceBlockValidation from './ServiceBlockValidation';
const blockDefinition = require('../../kapeta.yml');
const packageJson = require('../../package.json');

const blockType:BlockConfig = {
    kind: blockDefinition.metadata.name,
    version: packageJson.version,
    title: blockDefinition.metadata.title,
    validate: ServiceBlockValidation,
    componentType: ServiceBlockEditorComponent
};

export default blockType;
