﻿using System.Collections.Generic;
using System.Linq;
using Cloud.Repositories.Common;
using Cloud.Repositories.DataContext;
using Cloud.Repositories.Models;

namespace Cloud.Repositories.Repositories
{
    public class UserFileRepository : RepositoryBase
    {
        private readonly FileServerRepository _fileServerRepository;

        public UserFileRepository()
        {
            _fileServerRepository = new FileServerRepository();
        }

        public bool AddFile(UserFileModel file)
        {
            // Get all avaliable physical servers
            var servers = _fileServerRepository.GetFileServers();
            if (servers == null || !servers.Any()) return false;

            // Save file on all physical servers
            var serverManager = new ServerManager(servers, file.UserFile.UserId);
            serverManager.SaveFile(file.Stream, file.UserFile.Name + file.FileType.Extension);

            // Save file info to Db
            AddFile(file.UserFile);

            return true;
        }

        public void AddFile(UserFile file)
        {
            Add(file, true);
        }

        public UserFile GetFile(string userId, int fileId)
        {
            return Entities.UserFiles.SingleOrDefault(
                file => file.UserId == userId && file.FileId == fileId);
        }

        public IEnumerable<UserFile> GetFiles(string userId)
        {
            return Entities.UserFiles.Where(file => file.UserId == userId);
        }

        public bool UpdateFileName(UserFile fileToUpdate)
        {
            Entities.UserFiles.Attach(fileToUpdate);
            var entry = Entities.Entry(fileToUpdate);
            entry.Property(file => file.Name).IsModified = true;
            SaveChanges();

            return true;
        }

        public bool DeleteFile(int fileId)
        {
            var fileToDelete = Entities.UserFiles.First(file => file.FileId == fileId);
            if (fileToDelete == null) return false;

            // Delete file from db
            Entities.UserFiles.Attach(fileToDelete);
            Entities.UserFiles.Remove(fileToDelete);
            SaveChanges();

            return true;
        }
    }
}