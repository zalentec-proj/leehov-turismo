"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlogEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } } })],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-80 px-5 py-4 text-[15px] leading-8 text-leehov-text outline-none [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-leehov-cyan [&_blockquote]:bg-leehov-surface [&_blockquote]:p-4 [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="h-80 animate-pulse rounded-xl bg-leehov-surface" />;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("URL do link", previous ?? "https://");
    if (href === null) return;
    if (!href.trim()) return editor.chain().focus().extendMarkRange("link").unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim(), target: "_blank" }).run();
  };
  const controls = [
    { label: "Negrito", icon: Bold, active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
    { label: "Itálico", icon: Italic, active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
    { label: "Título", icon: Heading2, active: editor.isActive("heading", { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Lista", icon: List, active: editor.isActive("bulletList"), action: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Lista numerada", icon: ListOrdered, active: editor.isActive("orderedList"), action: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Citação", icon: Quote, active: editor.isActive("blockquote"), action: () => editor.chain().focus().toggleBlockquote().run() },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-leehov-border bg-white">
      <div className="flex flex-wrap gap-1 border-b border-leehov-border bg-leehov-surface p-2">
        {controls.map(({ label, icon: Icon, active, action }) => <Button key={label} type="button" size="icon" variant={active ? "default" : "ghost"} aria-label={label} title={label} onClick={action}><Icon className="size-4" /></Button>)}
        <Button type="button" size="icon" variant={editor.isActive("link") ? "default" : "ghost"} aria-label="Link" title="Link" onClick={setLink}><Link2 className="size-4" /></Button>
        <span className="mx-1 w-px bg-leehov-border" />
        <Button type="button" size="icon" variant="ghost" aria-label="Desfazer" title="Desfazer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></Button>
        <Button type="button" size="icon" variant="ghost" aria-label="Refazer" title="Refazer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
