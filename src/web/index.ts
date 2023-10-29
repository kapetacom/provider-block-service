/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { IBlockTypeProvider } from "@kapeta/ui-web-types";
import {ServiceBlockEditorComponent} from './ServiceBlockEditorComponent';
import ServiceBlockValidation from './ServiceBlockValidation';
const blockDefinition = require('../../kapeta.yml');
const packageJson = require('../../package.json');

const blockTypeProvider:IBlockTypeProvider = {
    kind: blockDefinition.metadata.name,
    version: packageJson.version,
    title: blockDefinition.metadata.title || blockDefinition.metadata.name,
    validate: ServiceBlockValidation,
    editorComponent: ServiceBlockEditorComponent,
    definition: blockDefinition
};

export default blockTypeProvider;
