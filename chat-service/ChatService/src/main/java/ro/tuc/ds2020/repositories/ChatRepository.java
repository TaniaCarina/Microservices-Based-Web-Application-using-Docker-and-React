package ro.tuc.ds2020.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.tuc.ds2020.entity.Message;

import java.util.List;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Message, UUID> {


}