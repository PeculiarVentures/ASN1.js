/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as pvtsutils from "pvtsutils";
import { IS_CONSTRUCTED, EMPTY_STRING, NAME, ID_BLOCK, FROM_BER, TO_BER, TAG_CLASS, TAG_NUMBER, IS_HEX_ONLY, LOCAL, VALUE_HEX_VIEW } from "./internals/constants";
import { Any } from "./Any";
import { Choice } from "./Choice";
import { Repeated } from "./Repeated";
import { localFromBER } from "./parser";
import { AsnType, typeStore } from "./TypeStore";

export type AsnSchemaType = AsnType | Any | Choice | Repeated;

export interface CompareSchemaSuccess {
  verified: true;
  result: AsnType & { [key: string]: any; };
}

export interface CompareSchemaFail {
  verified: false;
  name?: string;
  result: AsnType | { error: string; };
}

export type CompareSchemaResult = CompareSchemaSuccess | CompareSchemaFail;

/**
 * Compare of two ASN.1 object trees
 * @param root Root of input ASN.1 object tree
 * @param inputData Input ASN.1 object tree
 * @param inputSchema Input ASN.1 schema to compare with
 * @return Returns result of comparison
 */
export function compareSchema(root: AsnType, inputData: AsnType, inputSchema: AsnSchemaType): CompareSchemaResult {
  //#region Special case for Choice schema element type
  if (inputSchema instanceof Choice) {
    const choiceResult = false;

    for (let j = 0; j < inputSchema.value.length; j++) {
      const result = compareSchema(root, inputData, inputSchema.value[j]);
      if (result.verified) {
        return {
          verified: true,
          result: root
        };
      }
    }

    if (choiceResult === false) {
      const _result: CompareSchemaResult = {
        verified: false,
        result: {
          error: "Wrong values for Choice type"
        },
      };

      if (inputSchema.hasOwnProperty(NAME))
        _result.name = inputSchema.name;

      return _result;
    }
  }
  //#endregion
  //#region Special case for Any schema element type
  if (inputSchema instanceof Any) {
    //#region Add named component of ASN.1 schema
    if (inputSchema.hasOwnProperty(NAME))
      (root as any)[inputSchema.name] = inputData; // TODO Such call may replace original field of the object (eg idBlock)


    //#endregion
    return {
      verified: true,
      result: root
    };
  }
  //#endregion
  //#region Initial check
  if ((root instanceof Object) === false) {
    return {
      verified: false,
      result: { error: "Wrong root object" }
    };
  }

  if ((inputData instanceof Object) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 data" }
    };
  }

  if ((inputSchema instanceof Object) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }

  if ((ID_BLOCK in inputSchema) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  //#endregion
  //#region Comparing idBlock properties in ASN.1 data and ASN.1 schema
  //#region Encode and decode ASN.1 schema idBlock
  /// <remarks>This encoding/decoding is necessary because could be an errors in schema definition</remarks>
  if ((FROM_BER in inputSchema.idBlock) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }

  if ((TO_BER in inputSchema.idBlock) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }

  const encodedId = inputSchema.idBlock.toBER(false);
  if (encodedId.byteLength === 0) {
    return {
      verified: false,
      result: { error: "Error encoding idBlock for ASN.1 schema" }
    };
  }

  const decodedOffset = inputSchema.idBlock.fromBER(encodedId, 0, encodedId.byteLength);
  if (decodedOffset === -1) {
    return {
      verified: false,
      result: { error: "Error decoding idBlock for ASN.1 schema" }
    };
  }
  //#endregion
  //#region tagClass
  if (inputSchema.idBlock.hasOwnProperty(TAG_CLASS) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }

  if (inputSchema.idBlock.tagClass !== inputData.idBlock.tagClass) {
    return {
      verified: false,
      result: root
    };
  }
  //#endregion
  //#region tagNumber
  if (inputSchema.idBlock.hasOwnProperty(TAG_NUMBER) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }

  if (inputSchema.idBlock.tagNumber !== inputData.idBlock.tagNumber) {
    return {
      verified: false,
      result: root
    };
  }
  //#endregion
  //#region isConstructed
  if (inputSchema.idBlock.hasOwnProperty(IS_CONSTRUCTED) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }

  if (inputSchema.idBlock.isConstructed !== inputData.idBlock.isConstructed) {
    return {
      verified: false,
      result: root
    };
  }
  //#endregion
  //#region isHexOnly
  if (!(IS_HEX_ONLY in inputSchema.idBlock)) // Since 'isHexOnly' is an inherited property
  {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }

  if (inputSchema.idBlock.isHexOnly !== inputData.idBlock.isHexOnly) {
    return {
      verified: false,
      result: root
    };
  }
  //#endregion
  //#region valueHex
  if (inputSchema.idBlock.isHexOnly) {
    if ((VALUE_HEX_VIEW in inputSchema.idBlock) === false) // Since 'valueHex' is an inherited property
    {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }

    const schemaView = inputSchema.idBlock.valueHexView;
    const asn1View = inputData.idBlock.valueHexView;

    if (schemaView.length !== asn1View.length) {
      return {
        verified: false,
        result: root
      };
    }

    for (let i = 0; i < schemaView.length; i++) {
      if (schemaView[i] !== asn1View[1]) {
        return {
          verified: false,
          result: root
        };
      }
    }
  }
  //#endregion
  //#endregion
  //#region Add named component of ASN.1 schema
  if (inputSchema.name) {
    inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
    if (inputSchema.name)
      (root as any)[inputSchema.name] = inputData; // TODO check field existence. If exists throw an error
  }
  //#endregion
  //#region Getting next ASN.1 block for comparison
  if (inputSchema instanceof typeStore.Constructed) {
    // TODO not clear how it works for OctetString and BitString
    //* if (inputSchema.idBlock.isConstructed) {
    let admission = 0;
    let result: CompareSchemaResult = {
      verified: false,
      result: {
        error: "Unknown error",
      }
    };

    let maxLength = inputSchema.valueBlock.value.length;

    if (maxLength > 0) {
      if (inputSchema.valueBlock.value[0] instanceof Repeated) {
        // @ts-ignore
        maxLength = inputData.valueBlock.value.length; // TODO debug it
      }
    }

    //#region Special case when constructive value has no elements
    if (maxLength === 0) {
      return {
        verified: true,
        result: root
      };
    }
    //#endregion
    //#region Special case when "inputData" has no values and "inputSchema" has all optional values
    // @ts-ignore
    // TODO debug it
    if ((inputData.valueBlock.value.length === 0) &&
      (inputSchema.valueBlock.value.length !== 0)) {
      let _optional = true;

      for (let i = 0; i < inputSchema.valueBlock.value.length; i++)
        _optional = _optional && (inputSchema.valueBlock.value[i].optional || false);

      if (_optional) {
        return {
          verified: true,
          result: root
        };
      }

      //#region Delete early added name of block
      if (inputSchema.name) {
        inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
        if (inputSchema.name)
          delete (root as any)[inputSchema.name];
      }
      //#endregion
      root.error = "Inconsistent object length";

      return {
        verified: false,
        result: root
      };
    }
    //#endregion
    for (let i = 0; i < maxLength; i++) {
      //#region Special case when there is an OPTIONAL element of ASN.1 schema at the end
      // @ts-ignore
      if ((i - admission) >= inputData.valueBlock.value.length) {
        if (inputSchema.valueBlock.value[i].optional === false) {
          const _result: CompareSchemaResult = {
            verified: false,
            result: root
          };

          root.error = "Inconsistent length between ASN.1 data and schema";

          //#region Delete early added name of block
          if (inputSchema.name) {
            inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
            if (inputSchema.name) {
              delete (root as any)[inputSchema.name];
              _result.name = inputSchema.name;
            }
          }
          //#endregion

          return _result;
        }
      }

      //#endregion
      else {
        //#region Special case for Repeated type of ASN.1 schema element
        if (inputSchema.valueBlock.value[0] instanceof Repeated) {
          // @ts-ignore
          result = compareSchema(root, inputData.valueBlock.value[i], inputSchema.valueBlock.value[0].value);
          if (result.verified === false) {
            if (inputSchema.valueBlock.value[0].optional)
              admission++;
            else {
              //#region Delete early added name of block
              if (inputSchema.name) {
                inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                if (inputSchema.name)
                  delete (root as any)[inputSchema.name];
              }
              //#endregion

              return result;
            }
          }

          if ((NAME in inputSchema.valueBlock.value[0]) && (inputSchema.valueBlock.value[0].name.length > 0)) {
            let arrayRoot: Record<string, any> = {};

            if ((LOCAL in inputSchema.valueBlock.value[0]) && (inputSchema.valueBlock.value[0].local))
              arrayRoot = inputData;

            else
              arrayRoot = root;

            if (typeof arrayRoot[inputSchema.valueBlock.value[0].name] === "undefined")
              arrayRoot[inputSchema.valueBlock.value[0].name] = [];

            // @ts-ignore
            arrayRoot[inputSchema.valueBlock.value[0].name].push(inputData.valueBlock.value[i]);
          }
        }

        //#endregion
        else {
          // @ts-ignore
          result = compareSchema(root, inputData.valueBlock.value[i - admission], inputSchema.valueBlock.value[i]);
          if (result.verified === false) {
            if (inputSchema.valueBlock.value[i].optional)
              admission++;
            else {
              //#region Delete early added name of block
              if (inputSchema.name) {
                inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                if (inputSchema.name)
                  delete (root as any)[inputSchema.name];
              }
              //#endregion

              return result;
            }
          }
        }
      }
    }

    if (result.verified === false) // The situation may take place if last element is OPTIONAL and verification failed
    {
      const _result: CompareSchemaResult = {
        verified: false,
        result: root
      };

      //#region Delete early added name of block
      if (inputSchema.name) {
        inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
        if (inputSchema.name) {
          delete (root as any)[inputSchema.name];
          _result.name = inputSchema.name;
        }
      }
      //#endregion

      return _result;
    }

    return {
      verified: true,
      result: root
    };
  }
  //#endregion
  //#region Ability to parse internal value for primitive-encoded value (value of OctetString, for example)
  if (inputSchema.primitiveSchema &&
    (VALUE_HEX_VIEW in inputData.valueBlock)) {
    //#region Decoding of raw ASN.1 data
    const asn1 = localFromBER(inputData.valueBlock.valueHexView);
    if (asn1.offset === -1) {
      const _result: CompareSchemaResult = {
        verified: false,
        result: asn1.result
      };

      //#region Delete early added name of block
      if (inputSchema.name) {
        inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
        if (inputSchema.name) {
          delete (root as any)[inputSchema.name];
          _result.name = inputSchema.name;
        }
      }
      //#endregion

      return _result;
    }
    //#endregion

    return compareSchema(root, asn1.result, inputSchema.primitiveSchema);
  }

  return {
    verified: true,
    result: root
  };
  //#endregion
}
/**
 * ASN.1 schema verification for ArrayBuffer data
 * @param  inputBuffer Input BER-encoded ASN.1 data
 * @param  inputSchema Input ASN.1 schema to verify against to
 * @return
 */

export function verifySchema(inputBuffer: pvtsutils.BufferSource, inputSchema: AsnSchemaType): CompareSchemaResult {
  //#region Initial check
  if ((inputSchema instanceof Object) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema type" }
    };
  }
  //#endregion
  //#region Decoding of raw ASN.1 data
  const asn1 = localFromBER(pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer));
  if (asn1.offset === -1) {
    return {
      verified: false,
      result: asn1.result
    };
  }
  //#endregion
  //#region Compare ASN.1 struct with input schema

  return compareSchema(asn1.result, asn1.result, inputSchema);
  //#endregion
}
