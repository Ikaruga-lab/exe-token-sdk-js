export declare enum JSValueType {
    value_invalid = 0,
    value_string = 1,
    value_numberString = 2,
    value_boolean = 3,
    value_number = 4,
    value_regex = 5,
    value_array = 6,
    value_object = 7,
    value_null = 8,
    value_undefined = 9,
    value_nan = 10,
    value_infinity = 11,
    value_bytes = 12,
    value_function = 13
}
export interface JSArrayElement {
    value: string | number[];
    numberSign: boolean;
    valueType: JSValueType;
}
export interface JSArray {
    elements: JSArrayElement[];
    rootElementIndex: number;
    size: number;
}
export interface JSObjectProperty {
    valueType: JSValueType;
    value: string | number[];
    key: string;
    keyHash: string;
    numberSign: boolean;
}
export interface JSObject {
    properties: JSObjectProperty[];
    rootPropertyIndex: number;
    size: number;
}
export interface JSValue {
    valueType: JSValueType;
    identifierIndex: 0;
    value: string;
    numberSign: boolean;
}
export type InitialState = {
    args: JSValue[];
    identifiers: [];
};
export declare function toJSValue(value: any): JSValue;
