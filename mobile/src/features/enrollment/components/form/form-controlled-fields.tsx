import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Text, View } from "react-native";
import { Input, DateField, SelectField, type SelectOption } from "./form-fields";
import { type InputProps } from "../types/enrollment-types";

export function FormInput<T extends FieldValues>({
  control,
  name,
  ...props
}: Omit<InputProps, "value" | "onChangeText" | "error"> & {
  control: Control<T>;
  name: Path<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Input
          {...props}
          value={value as string}
          onChangeText={onChange}
          error={error?.message}
        />
      )}
    />
  );
}

export function FormDateField<T extends FieldValues>({
  control,
  name,
  label,
  onPress,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  onPress: () => void;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value }, fieldState: { error } }) => (
        <DateField
          label={label}
          value={value as string}
          onPress={onPress}
          error={error?.message}
        />
      )}
    />
  );
}

export function FormSelectField<T extends FieldValues>({
  control,
  name,
  ...props
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View>
          <SelectField
            {...props}
            value={value as string}
            onValueChange={onChange}
          />
          {error ? (
            <Text className="mt-1 text-xs text-red-500 mb-2">
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}
