import type { StringInputProps, TextInputProps } from "sanity";

export function CharCountInput(props: StringInputProps | TextInputProps) {
  const length = (props.value ?? "").length;
  return (
    <>
      {props.renderDefault(props)}
      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
        {length} characters
      </div>
    </>
  );
}
