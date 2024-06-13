import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define el tipo para los comentarios
interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Define el tipo para los posts
interface Post {
  id: number;
  orderId: number;
  paymentValidatorId: number;
  userId: number;
  authorId: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

interface PostContextType {
  posts: Post[];
  fetchPosts: (orderId: number, paymentValidatorId: number) => void;
  addPost: (post: Post) => void;
  addComment: (comment: Comment) => void;
}

// Define el contexto y el proveedor
const PostContext = createContext<PostContextType | undefined>(undefined);

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);

  // Función para obtener los posts desde la base de datos
  const fetchPosts = async (orderId: number, paymentValidatorId: number) => {
    try {
      const response = await fetch(`/api/mysqlPosts?orderId=${orderId}&paymentValidatorId=${paymentValidatorId}`);
      const data = await response.json();
      const postsWithComments = data.map((post: Post) => ({
        ...post,
        comments: post.comments || [],
      }));
      setPosts(postsWithComments);
    } catch (error) {
      console.error('Error al obtener los posts:', error);
    }
  };

  // Función para agregar un nuevo post
  const addPost = async (post: Post) => {
    try {
      const response = await fetch(`/api/mysqlPosts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });
      const newPost = await response.json();
      newPost.comments = []; // Asegúrate de inicializar los comentarios como un array vacío
      setPosts((prev) => [...prev, newPost]);
    } catch (error) {
      console.error('Error al agregar el post:', error);
    }
  };

  // Función para agregar un nuevo comentario
  const addComment = async (comment: Comment) => {
    try {
      const response = await fetch(`/api/mysqlComentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comment),
      });
      const newComment = await response.json();
      setPosts((prev) =>
        prev.map((post) => (post.id === comment.postId ? { ...post, comments: [...(post.comments || []), newComment] } : post))
      );
    } catch (error) {
      console.error('Error al agregar el comentario:', error);
    }
  };

  return (
    <PostContext.Provider value={{ posts, fetchPosts, addPost, addComment }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = (): PostContextType => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};
