use super::policy::{validate_completed_file, validate_selected_target, ValidatedTarget};
use crate::error::SafeError;
use tokio::io::AsyncWriteExt;

pub struct ManagedTemporaryFile {
    file: tokio::fs::File,
    temporary_path: tempfile::TempPath,
    target: ValidatedTarget,
}

impl ManagedTemporaryFile {
    pub fn create(target: ValidatedTarget) -> Result<Self, SafeError> {
        let temporary = tempfile::Builder::new()
            .prefix(".cloudadmin-")
            .suffix(".part")
            .tempfile_in(&target.parent)
            .map_err(|_| SafeError::download_filesystem())?;
        let (file, temporary_path) = temporary.into_parts();
        Ok(Self {
            file: tokio::fs::File::from_std(file),
            temporary_path,
            target,
        })
    }

    pub fn file_mut(&mut self) -> &mut tokio::fs::File {
        &mut self.file
    }

    pub async fn commit(mut self) -> Result<std::path::PathBuf, SafeError> {
        self.file
            .flush()
            .await
            .map_err(|_| SafeError::download_filesystem())?;
        self.file
            .sync_all()
            .await
            .map_err(|_| SafeError::download_filesystem())?;

        let Self {
            file,
            temporary_path,
            target,
        } = self;
        drop(file);
        let revalidated = validate_selected_target(&target.path)?;
        if revalidated.parent != target.parent
            || revalidated.path != target.path
            || revalidated.filename != target.filename
        {
            return Err(SafeError::download_policy());
        }
        let final_path = revalidated.path.clone();
        temporary_path
            .persist_noclobber(&final_path)
            .map_err(|_| SafeError::download_filesystem())?;
        match validate_completed_file(&final_path, &revalidated.parent) {
            Ok(canonical) => Ok(canonical),
            Err(error) => {
                let _ = std::fs::remove_file(&final_path);
                Err(error)
            }
        }
    }
}
