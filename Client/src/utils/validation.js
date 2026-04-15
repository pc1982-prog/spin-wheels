export const validateForm = ({ name, email, phone }) => {
    const errors = {};
    if (!name?.trim() || name.trim().length < 2)
      errors.name = "Name must be at least 2 characters";
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email))
      errors.email = "Please enter a valid email";
    if (!phone?.trim() || !/^[+]?[\d\s\-(). ]{7,20}$/.test(phone))
      errors.phone = "Please enter a valid phone number";
    return errors;
  };