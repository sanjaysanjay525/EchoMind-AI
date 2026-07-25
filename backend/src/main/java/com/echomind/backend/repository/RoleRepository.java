package com.echomind.backend.repository;

import com.echomind.backend.model.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {
    
    @Query("{ '$or': [ { 'title': { '$regex': ?0, '$options': 'i' } }, { 'keywords': { '$regex': ?0, '$options': 'i' } } ] }")
    List<Role> searchRoles(String query);

    List<Role> findByCategoryIgnoreCase(String category);
}
