import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  language: string;
  height?: string;
}

export default function ReadOnlyEditor({ value, language, height = '720px' }: Props) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme="vs-dark"
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
