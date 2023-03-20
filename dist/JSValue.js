"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJSValue = exports.JSValueType = void 0;
const ethers_1 = require("ethers");
const AbiTypes_1 = require("./AbiTypes");
var JSValueType;
(function (JSValueType) {
    JSValueType[JSValueType["value_invalid"] = 0] = "value_invalid";
    JSValueType[JSValueType["value_string"] = 1] = "value_string";
    JSValueType[JSValueType["value_numberString"] = 2] = "value_numberString";
    JSValueType[JSValueType["value_boolean"] = 3] = "value_boolean";
    JSValueType[JSValueType["value_number"] = 4] = "value_number";
    JSValueType[JSValueType["value_regex"] = 5] = "value_regex";
    JSValueType[JSValueType["value_array"] = 6] = "value_array";
    JSValueType[JSValueType["value_object"] = 7] = "value_object";
    JSValueType[JSValueType["value_null"] = 8] = "value_null";
    JSValueType[JSValueType["value_undefined"] = 9] = "value_undefined";
    JSValueType[JSValueType["value_nan"] = 10] = "value_nan";
    JSValueType[JSValueType["value_infinity"] = 11] = "value_infinity";
    JSValueType[JSValueType["value_bytes"] = 12] = "value_bytes";
    JSValueType[JSValueType["value_function"] = 13] = "value_function";
})(JSValueType = exports.JSValueType || (exports.JSValueType = {}));
function toJSValue(value) {
    const coder = ethers_1.ethers.utils.defaultAbiCoder;
    const typeOfValue = typeof value;
    if (value === undefined) {
        return {
            valueType: JSValueType.value_undefined,
            identifierIndex: 0,
            value: coder.encode(['string'], ['']),
            numberSign: true
        };
    }
    else if (value === null) {
        return {
            valueType: JSValueType.value_null,
            identifierIndex: 0,
            value: coder.encode(['string'], ['']),
            numberSign: true
        };
    }
    else if (typeOfValue === 'number') {
        const num = value;
        return {
            valueType: JSValueType.value_number,
            identifierIndex: 0,
            value: coder.encode(['uint'], [_toWei(Math.abs(num))]),
            numberSign: num >= 0
        };
    }
    else if (typeOfValue === 'boolean') {
        return {
            valueType: JSValueType.value_boolean,
            identifierIndex: 0,
            value: coder.encode(['bool'], [value]),
            numberSign: true
        };
    }
    else if (typeOfValue === 'string') {
        const strValue = value;
        const strNum = +strValue;
        if (Number.isNaN(strNum)) {
            return {
                valueType: JSValueType.value_string,
                identifierIndex: 0,
                value: coder.encode(['string'], [strValue]),
                numberSign: true
            };
        }
        else {
            return {
                valueType: JSValueType.value_numberString,
                identifierIndex: 0,
                value: coder.encode(['uint', 'string'], [strNum, strValue]),
                numberSign: true
            };
        }
    }
    else if (Array.isArray(value)) {
        const root = {
            value: [],
            numberSign: true,
            valueType: JSValueType.value_array
        };
        const array = {
            elements: [root],
            rootElementIndex: 0,
            size: 1
        };
        _makeArray(value, array);
        array.elements.forEach(elem => {
            if (elem.valueType === JSValueType.value_array) {
                elem.value = coder.encode(['uint[]'], [elem.value]);
            }
        });
        return {
            valueType: JSValueType.value_array,
            identifierIndex: 0,
            value: coder.encode([AbiTypes_1.arrayType], [array]),
            numberSign: true
        };
    }
    else if (typeOfValue === 'object') {
        const root = {
            valueType: JSValueType.value_object,
            value: [],
            key: '',
            keyHash: ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes("")),
            numberSign: true
        };
        const object = {
            properties: [root],
            rootPropertyIndex: 0,
            size: 1
        };
        _makeObject(value, object);
        object.properties.forEach(prop => {
            if (prop.valueType === JSValueType.value_object) {
                prop.value = coder.encode(['uint[]'], [prop.value]);
            }
        });
        return {
            valueType: JSValueType.value_object,
            identifierIndex: 0,
            value: coder.encode([AbiTypes_1.objectType], [object]),
            numberSign: true
        };
    }
    else {
        return {
            valueType: JSValueType.value_undefined,
            identifierIndex: 0,
            value: coder.encode(['string'], ['']),
            numberSign: true
        };
    }
}
exports.toJSValue = toJSValue;
function _toWei(val) {
    return BigInt(val * 10 ** 18);
}
function _makeArray(arrayValue, array) {
    for (const elemValue of arrayValue) {
        if (Array.isArray(elemValue)) {
            const childRoot = {
                value: [],
                numberSign: true,
                valueType: JSValueType.value_array
            };
            const curRootIndex = array.rootElementIndex;
            array.rootElementIndex = _pushElement(array, childRoot);
            _makeArray(elemValue, array);
            array.rootElementIndex = curRootIndex;
        }
        else if (typeof elemValue === 'object') {
            const objectValue = toJSValue(elemValue);
            const elem = { ...objectValue };
            _pushElement(array, elem);
        }
        else {
            const jsValue = toJSValue(elemValue);
            const elem = { ...jsValue };
            _pushElement(array, elem);
        }
    }
}
function _makeObject(objectValue, object) {
    Object.keys(objectValue).forEach(key => {
        const propertyKey = key;
        const propertyValue = objectValue[key];
        if (Array.isArray(propertyValue)) {
            const arrayValue = toJSValue(propertyValue);
            const property = {
                valueType: JSValueType.value_array,
                value: arrayValue.value,
                key: propertyKey,
                keyHash: ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes("")),
                numberSign: true
            };
            _setProperty(object, property);
        }
        else if (typeof propertyValue === 'object') {
            const childRoot = {
                valueType: JSValueType.value_object,
                value: [],
                key: propertyKey,
                keyHash: ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes("")),
                numberSign: true
            };
            const curRootIndex = object.rootPropertyIndex;
            object.rootPropertyIndex = _setProperty(object, childRoot);
            _makeObject(propertyValue, object);
            object.rootPropertyIndex = curRootIndex;
        }
        else {
            const jsValue = toJSValue(propertyValue);
            const property = {
                ...jsValue,
                key: propertyKey,
                keyHash: ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(""))
            };
            _setProperty(object, property);
        }
    });
}
function _pushElement(array, elem) {
    const indexes = array.elements[array.rootElementIndex].value;
    indexes.push(array.elements.length);
    array.elements.push(elem);
    array.size = array.elements.length;
    return indexes[indexes.length - 1];
}
function _setProperty(object, property) {
    const indexes = object.properties[object.rootPropertyIndex].value;
    indexes.push(object.properties.length);
    object.properties.push(property);
    object.size = object.properties.length;
    return indexes[indexes.length - 1];
}
