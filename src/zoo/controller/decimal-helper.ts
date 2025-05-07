import {
    type ValidationArguments,
    ValidatorConstraint,
    type ValidatorConstraintInterface,
} from 'class-validator';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention

export const number2Decimal = ({
    value,
}: {
    value: Decimal.Value | undefined;
}) => {
    if (value === undefined) {
        return;
    }
    Decimal.set({ precision: 7 });
    return Decimal(value);
};

@ValidatorConstraint({ name: 'decimalMax', async: false })
export class DecimalMax implements ValidatorConstraintInterface {
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [maxValue]: Decimal[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.lessThanOrEqualTo(maxValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss kleiner oder gleich ${(args.constraints[0] as Decimal).toNumber()} sein.`;
    }
}

@ValidatorConstraint({ name: 'decimalMin', async: false })
export class DecimalMin implements ValidatorConstraintInterface {
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [minValue]: Decimal[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.greaterThanOrEqualTo(minValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss groesser oder gleich ${(args.constraints[0] as Decimal).toNumber()} sein.`;
    }
}
