﻿using System.Threading.Tasks;
using Cloud.Common.Models;

namespace Cloud.Common.Interfaces {
	public interface IStorage {
		void Authorize();

		Task<IFile> AddFileAsync( string userId, FullUserFile file );

		Task<IFolder> AddFolderAsync( string userId, IFolder folder );

		Task<FolderData> GetRootFolderDataAsync( string userId );

		Task<FolderData> GetFolderDataAsync( string userId, string folderId );

		Task<IFile> GetFileInfoAsync( string userId, string fileId );

		Task<FullUserFile> GetFileAsync( string userId, string fileId );

		Task<string> UpdateFileNameAsync( string userId, string fileId, string newfileName );

		Task<string> UpdateFolderNameAsync( string userId, string folderId, string newFolderName );

		Task<bool> DeleteFileAsync( string userId, string fileId );

		Task<bool> DeleteFolderAsync( string userId, string folderId );
	}
}