import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePosts } from '../context/PostContext'; // Importamos el hook personalizado

const PostWithComments: React.FC<{ orderId: number; paymentValidatorId: number }> = ({ orderId, paymentValidatorId }) => {
  const { data: session } = useSession();
  const { posts, fetchPosts, addPost, addComment } = usePosts();
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  useEffect(() => {
    fetchPosts(orderId, paymentValidatorId);
  }, [orderId, paymentValidatorId]);

  const handleAddPost = async () => {
    if (session && newPostContent.trim()) {
      const post = {
        orderId,
        paymentValidatorId,
        userId: parseInt(session.token.sub),
        authorId: parseInt(session.token.sub),
        title: 'Nuevo Post',
        content: newPostContent,
        category: 'general',
        comments: [], // Asegúrate de inicializar los comentarios como un array vacío
      };
      addPost(post);
      setNewPostContent('');
    }
  };

  const handleAddComment = async (postId: number) => {
    if (session && newCommentContent.trim()) {
      const comment = {
        postId,
        userId: parseInt(session.token.sub),
        content: newCommentContent,
        status: 'active',
        category: 'comment',
      };
      addComment(comment);
      setNewCommentContent('');
      setSelectedPostId(null);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Posts y Comentarios</h2>
      <textarea
        className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
        placeholder="Escribe un nuevo post..."
        value={newPostContent}
        onChange={(e) => setNewPostContent(e.target.value)}
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleAddPost}>
        Añadir Post
      </button>
      <div className="mt-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-900 p-4 mb-4 rounded">
            <h3 className="text-lg font-bold text-white">{post.title}</h3>
            <p className="text-gray-400">{post.content}</p>
            <div className="mt-2">
              {post.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-700 p-2 mb-2 rounded">
                  <p className="text-white">{comment.content}</p>
                </div>
              ))}
            </div>
            {selectedPostId === post.id ? (
              <div className="mt-2">
                <textarea
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                  placeholder="Escribe un comentario..."
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => handleAddComment(post.id)}>
                  Añadir Comentario
                </button>
              </div>
            ) : (
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded mt-2"
                onClick={() => setSelectedPostId(post.id)}
              >
                Comentar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostWithComments;


