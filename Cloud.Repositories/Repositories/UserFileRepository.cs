﻿using System.Collections.Generic;
using System.IO;
using System.Linq;
using Cloud.Common.Interfaces;
using Cloud.Common.Types;
using Cloud.Repositories.Common;
using Cloud.Repositories.Repositories.ExternalStorages;

namespace Cloud.Repositories.Repositories
{
    public class UserFileRepository : RepositoryBase, IFileRepository
    {
        public bool Add(string userId, FullUserFile file)
        {
            // Save file on all physical servers
            var serverManager = new LocalFileServerManager();
            serverManager.SaveFile(file.Stream, file.UserFile.Name, file.UserFile.UserId);

            // Save file info to Db
            Add(file.UserFile, true);

            return true;
        }

        public IFile Get(string userId, int fileId)
        {
            return Entities.UserFiles.SingleOrDefault(
                file => file.UserId == userId && file.FileId == fileId);
        }

        public IEnumerable<IFile> GetRootFiles(string userId)
        {
            //return Entities.UserFiles.Where(file => file.UserId == userId);

            return new DriveRepository().GetRootFiles(userId);
        }

        public IEnumerable<IFolder> GetRootFolders(string userId)
        {
            //return Entities.UserFiles.Where(file => file.UserId == userId);

            return new DriveRepository().GetRootFolders(userId);
        }

        // todo: test
        // todo: implement return type info
        public bool UpdateName(string userId, int fileId, string newfileName)
        {
            var fileToUpdate = Entities.UserFiles.SingleOrDefault(
                file => file.FileId == fileId && file.UserId == userId);
            if (fileToUpdate == null) return false;

            // Rename file on servers
            var oldfileName = fileToUpdate.Name;
            var extention = Path.GetExtension(oldfileName);
            newfileName += extention;
            var serverManager = new LocalFileServerManager();
            if (!serverManager.RenameFile(userId, fileId, oldfileName, newfileName))
                return false;

            // Rename file in Db
            fileToUpdate.Name = newfileName;
            Entities.UserFiles.Attach(fileToUpdate);
            var entry = Entities.Entry(fileToUpdate);
            entry.Property(file => file.Name).IsModified = true;
            SaveChanges();

            return true;
        }

        public bool Delete(string userId, int fileId)
        {
            var fileToDelete = Entities.UserFiles.SingleOrDefault(
                file => file.FileId == fileId && file.UserId == userId);
            if (fileToDelete == null) return false;

            // Delete file from all servers

            var serverManager = new LocalFileServerManager();
            serverManager.DeleteFile(userId, fileToDelete.Name);

            // Delete file from db
            Entities.UserFiles.Attach(fileToDelete);
            Entities.UserFiles.Remove(fileToDelete);
            SaveChanges();

            return true;
        }
    }
}