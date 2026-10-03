export type InputFrame = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  potion: boolean;
  interact: boolean;
};

export const EMPTY_INPUT_FRAME: InputFrame = {
  up: false,
  down: false,
  left: false,
  right: false,
  attack: false,
  potion: false,
  interact: false,
};
