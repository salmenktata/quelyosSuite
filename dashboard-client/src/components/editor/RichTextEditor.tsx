/**
 * RichTextEditor Component
 *
 * Éditeur WYSIWYG basé sur TipTap pour contenu HTML riche
 *
 * Features:
 * - Barre d'outils complète (heading, bold, italic, lists, links, images)
 * - Support dark mode
 * - Placeholder personnalisable
 * - onChange callback pour synchronisation état parent
 * - Extensions : StarterKit, Image, Link, Placeholder
 */

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  ImageIcon,
} from 'lucide-react'
import { useCallback } from 'react'
import clsx from 'clsx'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

interface MenuBarProps {
  editor: Editor | null
}

function MenuBar({ editor }: MenuBarProps) {
  if (!editor) return null

  const addImage = useCallback(() => {
    const url = window.prompt('URL de l'image :')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt('URL du lien :')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('heading', { level: 1 }) && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Titre 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('heading', { level: 2 }) && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Titre 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('heading', { level: 3 }) && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Titre 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('bold') && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Gras"
      >
        <Bold className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('italic') && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Italique"
      >
        <Italic className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('code') && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('bulletList') && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Liste à puces"
      >
        <List className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('orderedList') && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Liste numérotée"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('blockquote') && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Citation"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Media & Links */}
      <button
        type="button"
        onClick={addLink}
        className={clsx(
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          editor.isActive('link') && 'bg-gray-300 dark:bg-gray-600'
        )}
        title="Insérer un lien"
      >
        <LinkIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={addImage}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Insérer une image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Annuler"
      >
        <Undo className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Refaire"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Commencez à écrire...',
  className = '',
  minHeight = '300px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: clsx(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3',
          'prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
          'prose-p:text-gray-700 dark:prose-p:text-gray-300',
          'prose-a:text-indigo-600 dark:prose-a:text-indigo-400',
          'prose-strong:text-gray-900 dark:prose-strong:text-white',
          'prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-blockquote:border-indigo-500 prose-blockquote:italic',
          'prose-img:rounded-lg prose-img:shadow-md'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className={clsx('rich-text-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800', className)}>
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className={clsx('overflow-y-auto')}
        style={{ minHeight }}
      />
    </div>
  )
}
