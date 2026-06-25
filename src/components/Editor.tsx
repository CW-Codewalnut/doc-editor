import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, FontFamily, FontSize, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Toolbar from "./Toolbar";
import PageView from "./PageView";

function Editor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: true, allowBase64: true }),
      Placeholder.configure({ placeholder: "Start typing..." }),
    ],
    autofocus: true,
  });

  return (
    <>
      {editor && <Toolbar editor={editor} />}
      <PageView>
        <EditorContent editor={editor} className="h-full" />
      </PageView>
    </>
  );
}

export default Editor;
