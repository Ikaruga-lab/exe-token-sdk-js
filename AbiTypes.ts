
import { ethers } from 'ethers'

export const arrayType = ethers.utils.ParamType.from({
  "components": [
    {
      "components": [
        {
          "internalType": "bytes",
          "name": "value",
          "type": "bytes"
        },
        {
          "internalType": "bool",
          "name": "numberSign",
          "type": "bool"
        },
        {
          "internalType": "enum IJSInterpreter.JSValueType",
          "name": "valueType",
          "type": "uint8"
        }
      ],
      "internalType": "struct IJSInterpreter.JSArrayElement[]",
      "name": "elements",
      "type": "tuple[]"
    },
    {
      "internalType": "uint256",
      "name": "rootElementIndex",
      "type": "uint256"
    }
  ],
  "internalType": "struct IJSInterpreter.JSArray",
  "name": "ret",
  "type": "tuple"
})

export const objectType = ethers.utils.ParamType.from({
  "components": [
    {
      "components": [
        {
          "internalType": "bytes",
          "name": "value",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "key",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "keyHash",
          "type": "bytes32"
        },
        {
          "internalType": "bool",
          "name": "numberSign",
          "type": "bool"
        },
        {
          "internalType": "enum IJSInterpreter.JSValueType",
          "name": "valueType",
          "type": "uint8"
        }
      ],
      "internalType": "struct IJSInterpreter.JSObjectProperty[]",
      "name": "properties",
      "type": "tuple[]"
    },
    {
      "internalType": "uint256",
      "name": "rootPropertyIndex",
      "type": "uint256"
    }
  ],
  "internalType": "struct IJSInterpreter.JSObject",
  "name": "obj",
  "type": "tuple"
})