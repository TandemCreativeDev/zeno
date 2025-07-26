// Form component for users table
// This file is auto-generated. Do not edit manually.
// Generated at: 2025-07-25T00:16:36.341Z

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserInsert, UserUpdate } from "@/models/user";
import { UserInsertSchema } from "@/models/user";
import { FormField, Fieldset, FormActions } from "@/components/ui";

export interface UserFormProps {
  mode: "create" | "edit";
  initialData?: UserUpdate;
  onSubmit: (data: UserInsert) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export default function UserForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  className = "",
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserInsert>({
    resolver: zodResolver(UserInsertSchema),
    defaultValues: initialData || {},
  });

  const onFormSubmit = (data: UserInsert) => {
    onSubmit(data);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={`max-w-4xl mx-auto space-y-6 ${className}`}
      aria-labelledby="form-heading"
    >
      <div className="prose text-center">
        <h2 id="form-heading">{mode === "create" ? "Create" : "Edit"} Users</h2>
        <p className="text-base-content/70 mt-2">
          Platform users (hosts and guests)
        </p>
      </div>

      <Fieldset legend="Basic Information" columns={2}>
        <FormField
          name="username"
          label="Username"
          type="text"
          required={true}
          placeholder="Enter unique username"
          helpText="3-100 characters, letters, numbers and underscore only"
          validation={{
            required: true,
            min: 3,
            max: 100,
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: "Please enter a valid format",
            },
          }}
          register={register}
          errors={errors}
        />
        <FormField
          name="email"
          label="Email Address"
          type="email"
          required={true}
          placeholder="user@example.com"
          validation={{ required: true, email: true, max: 255 }}
          register={register}
          errors={errors}
        />
        <FormField
          name="passwordHash"
          label="Password"
          type="text"
          required={true}
          placeholder="Enter password"
          register={register}
          errors={errors}
        />
      </Fieldset>

      <Fieldset legend="Personal Details" columns={2}>
        <FormField
          name="firstName"
          label="First Name"
          type="text"
          required={true}
          placeholder="Enter first name"
          validation={{ required: true, min: 1, max: 100 }}
          register={register}
          errors={errors}
        />
        <FormField
          name="lastName"
          label="Last Name"
          type="text"
          required={true}
          placeholder="Enter last name"
          validation={{ required: true, min: 1, max: 100 }}
          register={register}
          errors={errors}
        />
      </Fieldset>

      <Fieldset legend="Contact Information" columns={2}>
        <FormField
          name="phoneNumber"
          label="Phone Number"
          type="tel"
          required={false}
          placeholder="+66123456789"
          validation={{
            pattern: {
              value: /^\+?[1-9]\d{1,14}$/,
              message: "Please enter a valid format",
            },
          }}
          register={register}
          errors={errors}
        />
      </Fieldset>

      <Fieldset legend="Address Details" columns={2}>
        <FormField
          name="addressLine1"
          label="Address Line 1"
          type="text"
          required={false}
          placeholder="Street address"
          validation={{ max: 255 }}
          register={register}
          errors={errors}
        />
        <FormField
          name="addressLine2"
          label="Address Line 2"
          type="text"
          required={false}
          placeholder="Apartment, suite, etc. (optional)"
          validation={{ max: 255 }}
          register={register}
          errors={errors}
        />
        <FormField
          name="city"
          label="City"
          type="text"
          required={true}
          placeholder="City name"
          validation={{ max: 255 }}
          register={register}
          errors={errors}
        />
        <FormField
          name="country"
          label="Country"
          type="text"
          required={true}
          placeholder="Country name"
          validation={{ max: 255 }}
          register={register}
          errors={errors}
        />
        <FormField
          name="postalCode"
          label="Postal Code"
          type="text"
          required={false}
          placeholder="Postal/ZIP code"
          validation={{ max: 10 }}
          register={register}
          errors={errors}
        />
      </Fieldset>

      <Fieldset legend="Status Information" columns={2}>
        <FormField
          name="isActive"
          label="Active Status"
          type="checkbox"
          required={false}
          placeholder="Enter active status"
          helpText="Whether the user account is currently active"
          register={register}
          errors={errors}
        />
      </Fieldset>

      <FormActions
        mode={mode}
        loading={loading || isSubmitting}
        onCancel={onCancel}
        onReset={handleReset}
      />
    </form>
  );
}
