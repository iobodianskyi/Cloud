﻿using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Http;
using Cloud.Common.Managers;
using Cloud.Common.Models;
using Cloud.Repositories.DataContext;
using Cloud.WebApi.Models;

namespace Cloud.WebApi.Controllers {
	[RoutePrefix( "api/folders" )]
	public class FoldersController : ApiControllerBase {
		// GET api/folders
		[Route( "" )]
		public async Task<IHttpActionResult> GetRootFolderData() {
			var clouds = StorageRepository.GetStorages(UserId);
			var folderDatas = new List<FolderData>();
			foreach (var cloud in clouds) {
				folderDatas.Add(await cloud.GetRootFolderDataAsync(UserId));
			}

			return Ok(folderDatas);
		}

		// GET api/folders/1/cloud/1
		[Route( "{folderId}/cloud/{storageId:int}" )]
		public async Task<IHttpActionResult> GetFolderData( [FromUri] string folderId,
			[FromUri] int storageId ) {
			var cloud = StorageRepository.ResolveStorageInstance(storageId);
			var folderDada = await cloud.GetFolderDataAsync(UserId, folderId);

			return Ok(folderDada);
		}

		// POST: api/folders/cloud/1/create
		[Route( "cloud/{storageId:int}/create" )]
		[HttpPost]
		public async Task<IHttpActionResult> Create(
			[FromUri] int storageId, [FromBody] UserFolder folder ) {
			var cloud = StorageRepository.ResolveStorageInstance(storageId);
			var folderId = new IdGenerator().ForFolder();
			folder.Id = folderId;
			folder.UserId = UserId;
			folder.StorageId = storageId;
			var createdFolder = await cloud.AddFolderAsync(UserId, folder);

			return Ok(createdFolder);
		}

		// POST api/folders/1/cloud/1/rename
		[Route( "{folderId}/cloud/{storageId:int}/rename" )]
		[HttpPost]
		public IHttpActionResult RenameFolder( [FromUri] string folderId, [FromUri] int storageId,
			[FromBody] NewNameModel newFolder ) {
			if (string.IsNullOrEmpty(newFolder.Name)) return BadRequest();
			var cloud = StorageRepository.ResolveStorageInstance(storageId);
			cloud.UpdateFolderNameAsync(UserId, folderId, newFolder.Name);

			return Ok(newFolder.Name);
		}

		// DELETE: api/folders/1/cloud/1/delete
		[Route( "{folderId}/cloud/{storageId:int}/delete" )]
		public IHttpActionResult Delete( [FromUri] string folderId, [FromUri] int storageId ) {
			var cloud = StorageRepository.ResolveStorageInstance(storageId);
			cloud.DeleteFolderAsync(UserId, folderId);

			// todo: better return type
			return Ok(folderId);
		}
	}
}