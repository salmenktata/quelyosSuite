/**
 * EmailEditor - Éditeur WYSIWYG pour emails newsletter
 *
 * Utilise TipTap pour édition HTML riche avec :
 * - Formatage texte (bold, italic, underline)
 * - Titres (H1, H2, H3)
 * - Listes (ordonnées, non-ordonnées)
 * - Liens et images
 * - Variables dynamiques ({{prenom}}, {{email}})
 *
 * @component
 */

import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { api } from '@/lib/api'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Upload,
  Code,
  Undo,
  Redo
} from 'lucide-react'

interface EmailEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function EmailEditor({
  content,
  onChange,
  placeholder = 'Composez votre email...',
  minHeight = '400px'
}: EmailEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 hover:text-indigo-800 underline'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4'
      }
    }
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('URL de l\'image :')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image')
      return
    }

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/api/admin/newsletter/upload-image', formData)
      const data = response.data as { success: boolean; url?: string; error?: string }

      if (data.success && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run()
      } else {
        alert(`Erreur upload: ${data.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      // Reset input pour permettre re-upload même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const setLink = () => {
    const url = window.prompt('URL du lien :')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`{{${variable}}}`).run()
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
        {/* Historique */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Annuler"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Rétablir"
        >
          <Redo className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Formatage texte */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Gras"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Italique"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('code') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Titres */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Titre 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Titre 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Titre 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Listes */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Liens et images */}
        <button
          onClick={setLink}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('link') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Insérer un lien"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Insérer une image (URL)"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Upload une image"
        >
          <Upload className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadImage}
          className="hidden"
        />

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Variables */}
        <div className="relative group">
          <button
            className="px-3 py-2 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Insérer une variable"
          >
            Variables ▼
          </button>
          <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[150px]">
            <button
              onClick={() => insertVariable('prenom')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {'{{prenom}}'}
            </button>
            <button
              onClick={() => insertVariable('nom')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {'{{nom}}'}
            </button>
            <button
              onClick={() => insertVariable('email')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {'{{email}}'}
            </button>
            <button
              onClick={() => insertVariable('entreprise')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {'{{entreprise}}'}
            </button>
          </div>
        </div>
      </div>

      {/* Éditeur */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="bg-white dark:bg-gray-800"
      />
    </div>
  )
}
