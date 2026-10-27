'use client';

import ImageExt from '@tiptap/extension-image';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Heading3, ImageIcon, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { cn, mediaUrl } from '@/lib/utils';
import { MediaPicker } from './MediaPicker';

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), ImageExt],
    content: value,
    editorProps: { attributes: { class: 'prose-kalgi min-h-[360px] px-5 py-4 outline-none', 'aria-label': 'Blog content' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            ul: e.isActive('bulletList'),
            ol: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            link: e.isActive('link'),
          }
        : null,
  });

  if (!editor) return <div className="min-h-[420px] rounded-lg border border-stone-300 bg-white" />;

  const tools = [
    { icon: Bold, label: 'Bold', active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, label: 'Italic', active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { icon: Heading2, label: 'Heading', active: state?.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: Heading3, label: 'Subheading', active: state?.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: List, label: 'Bullet list', active: state?.ul, run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, label: 'Numbered list', active: state?.ol, run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: Quote, label: 'Quote', active: state?.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    {
      icon: Link2,
      label: 'Link',
      active: state?.link,
      run: () => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link address (leave empty to remove)', prev ?? 'https://');
        if (url === null) return;
        if (!url) editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      },
    },
    { icon: ImageIcon, label: 'Insert image', run: () => setPickerOpen(true) },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-stone-300 bg-white focus-within:border-navy focus-within:ring-3 focus-within:ring-navy/15">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-200 bg-stone-50 p-1.5" role="toolbar" aria-label="Formatting">
        {tools.map(({ icon: Icon, label, active, run }) => (
          <button key={label} type="button" onClick={run} aria-label={label} aria-pressed={active} title={label} className={cn('grid size-8 place-items-center rounded-md text-stone-600 hover:bg-stone-200', active && 'bg-stone-200 text-stone-900')}>
            <Icon className="size-4" />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-stone-300" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} aria-label="Undo" className="grid size-8 place-items-center rounded-md text-stone-600 hover:bg-stone-200"><Undo2 className="size-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} aria-label="Redo" className="grid size-8 place-items-center rounded-md text-stone-600 hover:bg-stone-200"><Redo2 className="size-4" /></button>
      </div>
      <EditorContent editor={editor} />
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(urls) => urls.forEach((u) => editor.chain().focus().setImage({ src: mediaUrl(u) }).run())} />
    </div>
  );
}
