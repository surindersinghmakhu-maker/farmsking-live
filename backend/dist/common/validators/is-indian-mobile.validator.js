"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsIndianMobile = IsIndianMobile;
const class_validator_1 = require("class-validator");
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
function IsIndianMobile(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isIndianMobile',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    return typeof value === 'string' && INDIAN_MOBILE_REGEX.test(value);
                },
                defaultMessage() {
                    return 'mobile must be a valid 10-digit Indian mobile number';
                },
            },
        });
    };
}
//# sourceMappingURL=is-indian-mobile.validator.js.map