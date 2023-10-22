import React, {ComponentType, useMemo} from "react";

import type {ILanguageTargetProvider} from "@kapeta/ui-web-types";

import {
    FormAvatarEditorField,
    AssetVersionSelector,
    AssetVersionSelectorEntry,
    useFormContextField,
    InfoBox
} from "@kapeta/ui-web-components";

import {BlockTargetProvider} from "@kapeta/ui-web-context";

import {parseKapetaUri} from "@kapeta/nodejs-utils";

interface Props {
    creating?:boolean
}


export const ServiceBlockEditorComponent = (props:Props) => {

    const kindField = useFormContextField('kind');
    const targetKindField = useFormContextField('spec.target.kind');

    const targetKind = targetKindField.get();
    const kind = kindField.get();

    const assetTypes:AssetVersionSelectorEntry[] = useMemo(() => {
        const mapper = (targetConfig:ILanguageTargetProvider):AssetVersionSelectorEntry => {
            const ref = `${targetConfig.kind}:${targetConfig.version}`;

            return {
                ref: ref,
                kind: targetConfig.definition?.kind ?? targetConfig.kind,
                title: targetConfig.title ?? targetConfig.definition?.metadata?.title,
                icon: targetConfig.icon ?? targetConfig.definition?.spec?.icon
            }
        };

        const targetUri = targetKind ? parseKapetaUri(targetKind) : null;
        const out = BlockTargetProvider.listAll(kind).map(mapper);
        if (targetUri &&
            !out.some(e => parseKapetaUri(e.ref).equals(targetUri))) {
            //Always add the current target if not already added.
            //This usually happens if block uses an older version
            try {
                const currentTarget = BlockTargetProvider.get(targetKind, kind);
                if (currentTarget) {
                    out.push(mapper(currentTarget))
                }
            } catch (e) {
                console.warn('Failed to select target', e);
            }
        }
        return out;
    }, [kind, targetKind]);

    const TargetConfigComponent: ComponentType | null = useMemo(() => {
        if (targetKind) {
            try {
                const currentTarget = BlockTargetProvider.get(targetKind, kind);

                if (currentTarget && currentTarget.editorComponent) {
                    return currentTarget.editorComponent;
                }
            } catch (e) {
                console.warn('Failed to select target', e);
            }
        }
        return null;
    }, [targetKind]);

    const renderTargetConfig = () => {
        if (!TargetConfigComponent) {
            return <div></div>;
        }

        return (
            <div className="form-section">
                <h3>Target configuration</h3>
                <TargetConfigComponent />
            </div>
        );
    }



    return (
        <div>
            <InfoBox>Service block that describes a backend exposing functionality such as APIs</InfoBox>
            <FormAvatarEditorField
                name={'spec.icon'}
                label={'Icon'}
                maxFileSize={1024 * 50}
                help={'Select an icon for this block to make it easier to identify. Max 50 kb - and we recommend using a square SVG image.'}
                fallbackIcon={'kap-icon-block'}
            />

            <AssetVersionSelector
                name={"spec.target.kind"}
                label={"Target"}
                validation={['required']}
                help={"This tells the code generation process which target programming language to use."}
                assetTypes={assetTypes}
            />

            {renderTargetConfig()}
        </div>
    )
};