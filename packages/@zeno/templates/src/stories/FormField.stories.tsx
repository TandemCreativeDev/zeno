import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { FormField } from "../components/FormField";

const meta: Meta<typeof FormField> = {
  title: "Components/FormField",
  component: FormField,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Universal form field component that handles all input types with built-in validation and accessibility features.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

interface FormFieldWrapperProps {
  name: string;
  defaultValue?: unknown;
  [key: string]: unknown;
}

const FormFieldWrapper = (args: FormFieldWrapperProps) => {
  const {
    register,
    formState: { errors },
  } = useForm({
    defaultValues: { [args.name]: args.defaultValue || "" },
  });

  return (
    <div className="max-w-md">
      <FormField {...args} register={register} errors={errors} />
    </div>
  );
};

export const TextInput: Story = {
  render: FormFieldWrapper,
  args: {
    name: "firstName",
    label: "First Name",
    type: "text",
    placeholder: "Enter your first name",
    required: true,
    helpText: "This field is required",
  },
};

export const EmailInput: Story = {
  render: FormFieldWrapper,
  args: {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "Enter your email",
    required: true,
    validation: {
      email: true,
    },
  },
};

export const NumberInput: Story = {
  render: FormFieldWrapper,
  args: {
    name: "age",
    label: "Age",
    type: "number",
    placeholder: "Enter your age",
    validation: {
      min: 18,
      max: 120,
    },
    helpText: "Must be between 18 and 120",
  },
};

export const TextArea: Story = {
  render: FormFieldWrapper,
  args: {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter a description",
    validation: {
      maxLength: 500,
    },
    helpText: "Maximum 500 characters",
  },
};

export const SelectField: Story = {
  render: FormFieldWrapper,
  args: {
    name: "country",
    label: "Country",
    type: "select",
    placeholder: "Choose your country",
    options: [
      { value: "us", label: "United States" },
      { value: "uk", label: "United Kingdom" },
      { value: "ca", label: "Canada" },
      { value: "au", label: "Australia" },
    ],
    required: true,
  },
};

export const CheckboxField: Story = {
  render: FormFieldWrapper,
  args: {
    name: "terms",
    label: "I agree to the terms and conditions",
    type: "checkbox",
    required: true,
    helpText: "You must accept the terms to continue",
  },
};
