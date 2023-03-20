import { ethers } from 'ethers'
import { arrayType, objectType } from './AbiTypes'

export enum JSValueType {
  value_invalid,
  value_string,
  value_numberString,
  value_boolean,
  value_number,
  value_regex,
  value_array,
  value_object,
  value_null,
  value_undefined,
  value_nan, 
  value_infinity, 
  value_bytes, 
  value_function 
}

export interface JSArrayElement {
  value: string | number[]
  numberSign: boolean
  valueType: JSValueType
}

export interface JSArray {
  elements: JSArrayElement[]
  rootElementIndex: number
  size: number
}

export interface JSObjectProperty {
  valueType: JSValueType
  value: string | number[]
  key: string
  keyHash: string
  numberSign: boolean
}

export interface JSObject {
  properties: JSObjectProperty[],
  rootPropertyIndex: number,
  size: number
}

export interface JSValue {
  valueType: JSValueType,
  identifierIndex: 0,
  value: string,
  numberSign: boolean,
}

export type InitialState = {
  args: JSValue[]
  identifiers: []
}

export function toJSValue(value: any): JSValue {
  const coder = ethers.utils.defaultAbiCoder
  const typeOfValue = typeof value
  if (value === 'undefined') {
    return {
      valueType: JSValueType.value_undefined,
      identifierIndex: 0,
      value: '',
      numberSign: true 
    } 
  } else if (value === null) {
    return {
      valueType: JSValueType.value_null,
      identifierIndex: 0,
      value: '',
      numberSign: true 
    } 
  } else if (typeOfValue === 'number') {
    const num = value as number
    return {
      valueType: JSValueType.value_number,
      identifierIndex: 0,
      value: coder.encode(['uint'], [_toWei(Math.abs(num))]),
      numberSign: num >= 0
    }
  } else if (typeOfValue === 'boolean') {
    return {
      valueType: JSValueType.value_boolean,
      identifierIndex: 0,
      value: coder.encode(['bool'], [value as boolean]),
      numberSign: true
    } 
  } else if (typeOfValue === 'string') {
    const strValue = value as string
    const strNum = +strValue
    if (Number.isNaN(strNum)) {
      return {
        valueType: JSValueType.value_string,
        identifierIndex: 0,
        value: coder.encode(['string'], [strValue]),
        numberSign: true
      } 
    } else {
      return {
        valueType: JSValueType.value_numberString,
        identifierIndex: 0,
        value: coder.encode(['uint', 'string'], [strNum, strValue]),
        numberSign: true
      } 
    }
  } else if (Array.isArray(value)) {
    const root = {
      value: [],
      numberSign: true,
      valueType: JSValueType.value_array
    }
    const array: JSArray = {
      elements: [root],
      rootElementIndex: 0,
      size: 1
    }
    _makeArray(value, array)
    array.elements.forEach(elem => {
      if (elem.valueType === JSValueType.value_array) {
        elem.value = coder.encode(['uint[]'], [elem.value])
      }
    })
    return {
      valueType: JSValueType.value_array,
      identifierIndex: 0,
      value: coder.encode([arrayType], [array]),
      numberSign: true
    } 
  } else if (typeOfValue === 'object') {
    const root: JSObjectProperty = {
      valueType: JSValueType.value_object,
      value: [],
      key: '',
      keyHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("")),
      numberSign: true
    }
    const object: JSObject = {
      properties: [root],
      rootPropertyIndex: 0,
      size: 1
    }
    _makeObject(value, object)
    object.properties.forEach(prop => {
      if (prop.valueType === JSValueType.value_object) {
        prop.value = coder.encode(['uint[]'], [prop.value])
      }
    })
    return {
      valueType: JSValueType.value_object,
      identifierIndex: 0,
      value: coder.encode([objectType], [object]),
      numberSign: true
    } 
  } else {
    return {
      valueType: JSValueType.value_undefined,
      identifierIndex: 0,
      value: '',
      numberSign: true 
    }
  }
}
function _toWei(val: number): BigInt {
  return BigInt(val * 10 ** 18)
}

function _makeArray(arrayValue: Array<any>, array: JSArray) {
  for (const elemValue of arrayValue) {
    if (Array.isArray(elemValue)) {
      const childRoot = {
        value: [],
        numberSign: true,
        valueType: JSValueType.value_array
      }
      const curRootIndex = array.rootElementIndex
      array.rootElementIndex = _pushElement(array, childRoot)
      _makeArray(elemValue, array)
      array.rootElementIndex = curRootIndex
    } else if (typeof elemValue === 'object') {
      const objectValue = toJSValue(elemValue)
      const elem: JSArrayElement = { ...objectValue }
      _pushElement(array, elem)
    } else {
      const jsValue = toJSValue(elemValue)
      const elem: JSArrayElement = { ...jsValue }
      _pushElement(array, elem)
    }
  }
}

function _makeObject(objectValue: {[key:string]:any}, object: JSObject) {
  Object.keys(objectValue).forEach(key => {
    const propertyKey = key
    const propertyValue = objectValue[key]
    if (Array.isArray(propertyValue)) {
      const arrayValue = toJSValue(propertyValue)
      const property: JSObjectProperty = {
        valueType: JSValueType.value_array,
        value: arrayValue.value,
        key: propertyKey,
        keyHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("")),
        numberSign: true
      }
      _setProperty(object, property)
    } else if (typeof propertyValue === 'object') {
      const childRoot: JSObjectProperty = {
        valueType: JSValueType.value_object,
        value: [],
        key: propertyKey,
        keyHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("")),
        numberSign: true
      }
      const curRootIndex = object.rootPropertyIndex
      object.rootPropertyIndex = _setProperty(object, childRoot)
      _makeObject(propertyValue, object)
      object.rootPropertyIndex = curRootIndex
    } else {
      const jsValue = toJSValue(propertyValue)
      const property: JSObjectProperty = {
        ...jsValue,
        key: propertyKey,
        keyHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
      }
      _setProperty(object, property)
    }
  })
}

function _pushElement(array: JSArray, elem: JSArrayElement): number {
  const indexes = array.elements[array.rootElementIndex].value as number[]
  indexes.push(array.elements.length)
  array.elements.push(elem)
  array.size = array.elements.length
  return indexes[indexes.length - 1]
}

function _setProperty(object: JSObject, property: JSObjectProperty): number {
  const indexes = object.properties[object.rootPropertyIndex].value as number[]
  indexes.push(object.properties.length)
  object.properties.push(property)
  object.size = object.properties.length
  return indexes[indexes.length - 1]
}
