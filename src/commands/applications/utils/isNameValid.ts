import { name as nameValidation } from '@alternatefutures/utils-validation';

type IsNameValidArgs = {
  name: string;
};

export const isNameValid = ({ name }: IsNameValidArgs) =>
  nameValidation.safeParse(name).success;
