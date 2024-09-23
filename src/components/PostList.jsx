/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addPost, fetchPosts, fetchTags } from "../api/api";
import { useState } from "react";

function PostList() {
  const [page, setPage] = useState(1);
  const {
    data: postData,
    isLoading,
    isError,
    error,
  } = useQuery({
    // will write whole query like in URL
    queryKey: ["posts", { page }],
    // function that needs to be call
    queryFn: () => fetchPosts(page),
    staleTime: 1000 * 60 * 5,
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const queryClient = useQueryClient();
  // use for post API call
  const {
    mutate,
    isError: isPostError,
    isPending,
    error: postError,
    reset,
  } = useMutation({
    mutationFn: addPost,
    // onMutate runs before the  mutate has happenend
    onMutate: ({id,title,tags}) => {
      return { id ,title,tags};
    },
    // runs after the mutation has happened
    onSuccess: (data, variable, context) => {
      queryClient.invalidateQueries({
        queryKey: ["posts", { page: 1 }],
        exact: true,
        predicate: (query) =>
          query.queryKey[0] === "posts" && query.queryKey[1].page >= 2,
      });
    },
    // onError: (error, variables, context) => {},
    // onSettled: (data, error, variables, context) => {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get("title");
    const tags = Array.from(formData.keys()).filter(
      (key) => formData.get(key) === "on"
    );
    console.log(title,tags)
    if (!title || !tags)
      return mutate({ id: postData?.data?.length + 1, title, tags });
    e.target.reset();
  };
  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Enter your post..."
          className="postbox"
        />
        <div className="tags">
          {tagsData?.map((tag) => {
            return (
              <div key={tag}>
                <input name={tag} id={tag} type="checkbox" />
                <label htmlFor={tag}>{tag}</label>
              </div>
            );
          })}
        </div>
        <button>Post</button>
      </form>
      {isLoading && isPending && <p>loading...</p>}
      {isError && <p>{error?.message}</p>}
      {isPostError && <p onClick={() => reset()}>{postError?.message}</p>}
      <div className="pages">
        <button
          onClick={() => setPage((oldpage) => Math.max(oldpage - 1, 0))}
          disabled={!postData?.prev}
        >
          PreviousPage
        </button>
        <span>{page}</span>
        <button
          onClick={() => {
            setPage((oldPage) => oldPage + 1);
          }}
          disabled={!postData?.next}
        >
          NextPage
        </button>
      </div>
      {postData?.data?.map((post) => {
        return (
          <div key={post.id} className="post">
            <div>{post.title}</div>
            {post.tags.map((tag) => (
              <span>{tag}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default PostList;
