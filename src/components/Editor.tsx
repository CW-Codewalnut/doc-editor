import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  TextStyle,
  FontFamily,
  FontSize,
  Color,
} from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Toolbar from "./Toolbar";
import PageView from "./PageView";

function Editor() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [activeEditorType, setActiveEditorType] = useState<"body" | "header">(
    "body"
  );
  const [headerHtml, setHeaderHtml] = useState("");

  const bodyEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Link.configure({ openOnClick: false }),
      Underline.configure(),
      TextStyle.configure(),
      FontFamily.configure(),
      FontSize.configure(),
      Color.configure(),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: true }),
      Placeholder.configure({ placeholder: "Start typing..." }),
    ],
    autofocus: true,
    onFocus: () => setActiveEditorType("body"),
  });

  const headerEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Link.configure({ openOnClick: false }),
      Underline.configure(),
      TextStyle.configure(),
      FontFamily.configure(),
      FontSize.configure(),
      Color.configure(),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["paragraph"] }),
      Placeholder.configure({ placeholder: "Click here to add a header" }),
    ],
    onFocus: () => setActiveEditorType("header"),
    onUpdate: ({ editor }) => {
      setHeaderHtml(editor.getHTML());
    },
  });

  const activeEditor =
    activeEditorType === "header" && headerEditor ? headerEditor : bodyEditor;

  const toggleHeader = useCallback(() => {
    setIsHeaderVisible((previous) => {
      if (previous && activeEditorType === "header") {
        setActiveEditorType("body");
        bodyEditor?.commands.focus();
      }
      return !previous;
    });
  }, [activeEditorType, bodyEditor]);

  return (
    <>
      {activeEditor && (
        <Toolbar
          editor={activeEditor}
          isHeaderVisible={isHeaderVisible}
          onToggleHeader={toggleHeader}
        />
      )}
      <PageView
        documentHeaderSlot={
          headerEditor && (
            <EditorContent editor={headerEditor} className="header-editor" />
          )
        }
        documentHeaderHtml={headerHtml}
        isDocumentHeaderVisible={isHeaderVisible}
      >
        <EditorContent editor={bodyEditor} className="h-full" />
      </PageView>
    </>
  );
}

export default Editor;
