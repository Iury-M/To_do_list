export default function TaskCard({ task }) {
  return (
    <div className="border p-4 rounded shadow mb-4">
      <h2 className="text-lg font-semibold">{task.title}</h2>

      {task.fileUrl && (
        <>
          {task.fileUrl.endsWith(".mp3") || task.fileUrl.endsWith(".wav") ? (
            <audio controls src={task.fileUrl} className="mt-2 w-full" />
          ) : (
            <img src={task.fileUrl} alt="Arquivo" className="mt-2 max-h-48" />
          )}
        </>
      )}
    </div>
  );
}
